class AuthUser {
  final String id;
  final String? email;
  final String? displayName;
  final bool isGuest;
  final String role;

  const AuthUser({
    required this.id,
    required this.isGuest,
    required this.role,
    this.email,
    this.displayName,
  });

  factory AuthUser.fromJson(Map<String, dynamic> j) => AuthUser(
        id: j['id'] as String,
        email: j['email'] as String?,
        displayName: j['displayName'] as String?,
        isGuest: j['isGuest'] as bool? ?? false,
        role: j['role'] as String? ?? 'USER',
      );
}
