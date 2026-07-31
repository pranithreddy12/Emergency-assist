import 'package:flutter_test/flutter_test.dart';
import 'package:emergencyai/features/rescue/presentation/widgets/call_help_bar.dart';

void main() {
  test('emergency number is country-aware, defaulting to 112', () {
    expect(numberForCountry('US'), '911');
    expect(numberForCountry('gb'), '999'); // case-insensitive
    expect(numberForCountry('AU'), '000');
    expect(numberForCountry('JP'), '119'); // distinct ambulance number
    expect(numberForCountry('FR'), '112'); // EU → universal default
    expect(numberForCountry('ZZ'), '112'); // unknown
    expect(numberForCountry(null), '112'); // no country
  });
}
