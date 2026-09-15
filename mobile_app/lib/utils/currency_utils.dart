/// Helper utility for currency formatting and Rupee Amount in Words conversion
class CurrencyUtils {
  /// Format double to Indian Rupee standard format (e.g. ₹28,500.00)
  static String formatRupees(double amount) {
    final String formattedNumber = amount.toStringAsFixed(2);
    final List<String> parts = formattedNumber.split('.');
    String integerPart = parts[0];
    final String decimalPart = parts[1];

    final bool isNegative = integerPart.startsWith('-');
    if (isNegative) {
      integerPart = integerPart.substring(1);
    }

    if (integerPart.length > 3) {
      final String lastThree = integerPart.substring(integerPart.length - 3);
      String remaining = integerPart.substring(0, integerPart.length - 3);
      final List<String> groups = [];
      while (remaining.length > 2) {
        groups.insert(0, remaining.substring(remaining.length - 2));
        remaining = remaining.substring(0, remaining.length - 2);
      }
      if (remaining.isNotEmpty) {
        groups.insert(0, remaining);
      }
      integerPart = '${groups.join(',')},$lastThree';
    }

    final String result = '${isNegative ? '-' : ''}₹$integerPart.$decimalPart';
    return result;
  }

  /// Convert numeric Rupee amount to English words (e.g. 28500 -> "Rupees Twenty-Eight Thousand Five Hundred Only")
  static String amountInWords(double amount) {
    if (amount <= 0) return 'Rupees Zero Only';
    int number = amount.round();

    final List<String> units = [
      '',
      'One',
      'Two',
      'Three',
      'Four',
      'Five',
      'Six',
      'Seven',
      'Eight',
      'Nine',
      'Ten',
      'Eleven',
      'Twelve',
      'Thirteen',
      'Fourteen',
      'Fifteen',
      'Sixteen',
      'Seventeen',
      'Eighteen',
      'Nineteen'
    ];

    final List<String> tens = [
      '',
      '',
      'Twenty',
      'Thirty',
      'Forty',
      'Fifty',
      'Sixty',
      'Seventy',
      'Eighty',
      'Ninety'
    ];

    String convertLessThanThousand(int n) {
      if (n == 0) return '';
      if (n < 20) return units[n];
      if (n < 100) return '${tens[n ~/ 10]} ${units[n % 10]}'.trim();
      return '${units[n ~/ 100]} Hundred ${convertLessThanThousand(n % 100)}'.trim();
    }

    String resultWords = '';

    if (number >= 10000000) {
      final int crore = number ~/ 10000000;
      resultWords += '${convertLessThanThousand(crore)} Crore ';
      number %= 10000000;
    }

    if (number >= 100000) {
      final int lakh = number ~/ 100000;
      resultWords += '${convertLessThanThousand(lakh)} Lakh ';
      number %= 100000;
    }

    if (number >= 1000) {
      final int thousand = number ~/ 1000;
      resultWords += '${convertLessThanThousand(thousand)} Thousand ';
      number %= 1000;
    }

    if (number > 0) {
      resultWords += convertLessThanThousand(number);
    }

    return 'Rupees ${resultWords.trim()} Only';
  }
}
