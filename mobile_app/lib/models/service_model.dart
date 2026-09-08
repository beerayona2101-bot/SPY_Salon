class ServiceModel {
  final String id;
  final String name;
  final String category;
  final double price;
  final String duration;
  final String description;
  final double rating;

  ServiceModel({
    required this.id,
    required this.name,
    required this.category,
    required this.price,
    required this.duration,
    required this.description,
    required this.rating,
  });

  factory ServiceModel.fromJson(Map<String, dynamic> json) {
    return ServiceModel(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? json['title'] ?? '',
      category: json['category'] ?? 'General',
      price: (json['price'] != null) ? (json['price'] as num).toDouble() : 0.0,
      duration: json['duration'] ?? '30 min',
      description: json['description'] ?? '',
      rating: (json['rating'] != null) ? (json['rating'] as num).toDouble() : 4.8,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'category': category,
      'price': price,
      'duration': duration,
      'description': description,
      'rating': rating,
    };
  }
}
