const fs = require('fs');
const path = require('path');
const { PHASE_DEVELOPMENT_SERVER } = require('next/constants');

// Patch Node's fs module to bypass Windows/OneDrive reparse point isSymbolicLink false positives.
// OneDrive placeholder directories/files report isSymbolicLink() === true, but readlink on them fails with EINVAL.
// We intercept readdir and lstat to override isSymbolicLink() to return false for such entries,
// forcing Node/Next.js to treat them as normal directories/files and preventing crashes/loops.
// IMPORTANT: To preserve performance, we immediately bypass checks for node_modules.

const originalLstatSync = fs.lstatSync;
fs.lstatSync = function (path, options) {
  if (typeof path === 'string' && path.includes('node_modules')) {
    return originalLstatSync(path, options);
  }
  const stats = originalLstatSync(path, options);
  if (stats && stats.isSymbolicLink()) {
    try {
      fs.readlinkSync(path);
    } catch (err) {
      if (err.code === 'EINVAL') {
        stats.isSymbolicLink = () => false;
      }
    }
  }
  return stats;
};

const originalLstat = fs.lstat;
fs.lstat = function (path, options, callback) {
  if (typeof options === 'function') {
    const cb = options;
    if (typeof path === 'string' && path.includes('node_modules')) {
      return originalLstat(path, cb);
    }
    return originalLstat(path, (err, stats) => {
      if (!err && stats && stats.isSymbolicLink()) {
        try {
          fs.readlinkSync(path);
        } catch (readErr) {
          if (readErr.code === 'EINVAL') {
            stats.isSymbolicLink = () => false;
          }
        }
      }
      cb(err, stats);
    });
  }

  const cb = callback;
  if (typeof path === 'string' && path.includes('node_modules')) {
    return originalLstat(path, options, cb);
  }
  return originalLstat(path, options, (err, stats) => {
    if (!err && stats && stats.isSymbolicLink()) {
      try {
        fs.readlinkSync(path);
      } catch (readErr) {
        if (readErr.code === 'EINVAL') {
          stats.isSymbolicLink = () => false;
        }
      }
    }
    if (typeof cb === 'function') cb(err, stats);
  });
};

if (fs.promises && fs.promises.lstat) {
  const originalPromisesLstat = fs.promises.lstat;
  fs.promises.lstat = async function (path, options) {
    if (typeof path === 'string' && path.includes('node_modules')) {
      return originalPromisesLstat(path, options);
    }
    const stats = await originalPromisesLstat(path, options);
    if (stats && stats.isSymbolicLink()) {
      try {
        fs.readlinkSync(path);
      } catch (err) {
        if (err.code === 'EINVAL') {
          stats.isSymbolicLink = () => false;
        }
      }
    }
    return stats;
  };
}

const originalReaddirSync = fs.readdirSync;
fs.readdirSync = function (path, options) {
  if (typeof path === 'string' && path.includes('node_modules')) {
    return originalReaddirSync(path, options);
  }
  const result = originalReaddirSync(path, options);
  if (result && typeof options === 'object' && options !== null && options.withFileTypes) {
    for (const entry of result) {
      if (entry.isSymbolicLink()) {
        try {
          const entryPath = require('path').join(path, entry.name);
          fs.readlinkSync(entryPath);
        } catch (err) {
          if (err.code === 'EINVAL') {
            entry.isSymbolicLink = () => false;
            try {
              const stats = fs.statSync(require('path').join(path, entry.name));
              entry.isDirectory = () => stats.isDirectory();
              entry.isFile = () => stats.isFile();
            } catch (e) { }
          }
        }
      }
    }
  }
  return result;
};

const originalReaddir = fs.readdir;
fs.readdir = function (path, options, callback) {
  if (typeof options === 'function') {
    const cb = options;
    if (typeof path === 'string' && path.includes('node_modules')) {
      return originalReaddir(path, cb);
    }
    return originalReaddir(path, (err, result) => {
      cb(err, result);
    });
  }

  const cb = callback;
  if (typeof path === 'string' && path.includes('node_modules')) {
    return originalReaddir(path, options, cb);
  }
  return originalReaddir(path, options, (err, result) => {
    if (!err && result && typeof options === 'object' && options !== null && options.withFileTypes) {
      for (const entry of result) {
        if (entry.isSymbolicLink()) {
          try {
            const entryPath = require('path').join(path, entry.name);
            fs.readlinkSync(entryPath);
          } catch (readErr) {
            if (readErr.code === 'EINVAL') {
              entry.isSymbolicLink = () => false;
              try {
                const stats = fs.statSync(entryPath);
                entry.isDirectory = () => stats.isDirectory();
                entry.isFile = () => stats.isFile();
              } catch (e) { }
            }
          }
        }
      }
    }
    if (typeof cb === 'function') cb(err, result);
  });
};

if (fs.promises && fs.promises.readdir) {
  const originalPromisesReaddir = fs.promises.readdir;
  fs.promises.readdir = async function (path, options) {
    if (typeof path === 'string' && path.includes('node_modules')) {
      return originalPromisesReaddir(path, options);
    }
    const result = await originalPromisesReaddir(path, options);
    if (result && typeof options === 'object' && options !== null && options.withFileTypes) {
      for (const entry of result) {
        if (entry.isSymbolicLink()) {
          try {
            const entryPath = require('path').join(path, entry.name);
            fs.readlinkSync(entryPath);
          } catch (err) {
            if (err.code === 'EINVAL') {
              entry.isSymbolicLink = () => false;
              try {
                const stats = fs.statSync(entryPath);
                entry.isDirectory = () => stats.isDirectory();
                entry.isFile = () => stats.isFile();
              } catch (e) { }
            }
          }
        }
      }
    }
    return result;
  };
}

module.exports = (phase) => {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;

  /** @type {import('next').NextConfig} */
  const nextConfig = {
    distDir: isDev ? 'node_modules/.next-dev' : '.next',
    reactStrictMode: true,
    compress: true,
    webpack: (config, { dev }) => {
      if (dev) {
        // Disable Webpack cache in development to prevent OneDrive file-lock and sync collisions
        config.cache = false;
      }
      return config;
    },

    compiler: {
      removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
    },
    images: {
      formats: ['image/avif', 'image/webp'],
      remotePatterns: [
        { protocol: 'https', hostname: 'images.unsplash.com' },
        { protocol: 'https', hostname: 'res.cloudinary.com' }
      ]
    },
    experimental: {
      optimizePackageImports: ['lucide-react', 'framer-motion']
    },
    async headers() {
      return [
        {
          source: '/:all*(svg|jpg|png|webp|avif|ico|woff|woff2)',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=31536000, immutable',
            },
          ],
        },
      ];
    },
  };

  return nextConfig;
};
