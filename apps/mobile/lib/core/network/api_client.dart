import 'package:dio/dio.dart';
import '../config/env.dart';
import '../storage/token_storage.dart';

class ApiException implements Exception {
  final int? statusCode;
  final String message;
  ApiException(this.message, [this.statusCode]);
  @override
  String toString() => 'ApiException($statusCode): $message';
}

/// Thin Dio wrapper: attaches the bearer token and transparently refreshes it
/// once on a 401 before retrying the original request.
class ApiClient {
  final Dio _dio;
  final TokenStorage _tokens;
  bool _refreshing = false;

  ApiClient(this._tokens)
      : _dio = Dio(BaseOptions(
          baseUrl: Env.apiBaseUrl,
          connectTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 15),
          headers: {'Content-Type': 'application/json'},
        )) {
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _tokens.accessToken;
        if (token != null) options.headers['Authorization'] = 'Bearer $token';
        handler.next(options);
      },
      onError: (e, handler) async {
        if (e.response?.statusCode == 401 && !_refreshing) {
          final refreshed = await _tryRefresh();
          if (refreshed) {
            final clone = await _retry(e.requestOptions);
            return handler.resolve(clone);
          }
        }
        handler.next(e);
      },
    ));
  }

  Future<bool> _tryRefresh() async {
    final refresh = await _tokens.refreshToken;
    if (refresh == null) return false;
    _refreshing = true;
    try {
      final res = await Dio(BaseOptions(baseUrl: Env.apiBaseUrl))
          .post('/auth/refresh', data: {'refreshToken': refresh});
      await _tokens.save(
        accessToken: res.data['accessToken'],
        refreshToken: res.data['refreshToken'],
      );
      return true;
    } catch (_) {
      await _tokens.clear();
      return false;
    } finally {
      _refreshing = false;
    }
  }

  Future<Response<dynamic>> _retry(RequestOptions ro) async {
    final token = await _tokens.accessToken;
    return _dio.request(
      ro.path,
      data: ro.data,
      queryParameters: ro.queryParameters,
      options: Options(method: ro.method, headers: {
        ...ro.headers,
        'Authorization': 'Bearer $token',
      }),
    );
  }

  Future<dynamic> get(String path) => _unwrap(() => _dio.get(path));
  Future<dynamic> post(String path, [Object? body]) =>
      _unwrap(() => _dio.post(path, data: body));
  Future<dynamic> put(String path, [Object? body]) =>
      _unwrap(() => _dio.put(path, data: body));
  Future<dynamic> patch(String path, [Object? body]) =>
      _unwrap(() => _dio.patch(path, data: body));
  Future<dynamic> delete(String path) => _unwrap(() => _dio.delete(path));

  Future<dynamic> _unwrap(Future<Response<dynamic>> Function() fn) async {
    try {
      final res = await fn();
      return res.data;
    } on DioException catch (e) {
      final data = e.response?.data;
      final msg = (data is Map && data['message'] != null)
          ? data['message'].toString()
          : (e.message ?? 'Network error');
      throw ApiException(msg, e.response?.statusCode);
    }
  }
}
