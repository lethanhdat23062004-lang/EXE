# SOUL Flutter App 🌿

Flutter mobile app cho **SOUL** - nền tảng chăm sóc sức khỏe tinh thần.

## Cấu trúc dự án

```
lib/
├── main.dart              # Entry point
├── app.dart               # GoRouter + MaterialApp
├── core/
│   ├── api/               # Dio HTTP client + API config
│   ├── constants/         # Colors palette
│   └── storage/           # SharedPreferences wrapper
├── features/
│   ├── auth/              # Login, Register, Forgot, Verify, Recovery
│   ├── home/              # Home dashboard
│   ├── ai_chat/           # SOUL AI Chat
│   ├── diary/             # Emotional diary
│   ├── emotional_test/    # WHO-5 & PSS-10 assessment
│   ├── events/            # Events & workshops
│   └── forum/             # Community forum
└── shared/
    └── widgets/           # Reusable components
```

## Cài đặt

### Yêu cầu
- Flutter SDK >= 3.0.0
- Dart SDK >= 3.0.0

### Cài dependencies

```bash
cd frontend/APP/soul_flutter
flutter pub get
```

### Cấu hình API

Mở `lib/core/api/config.dart` và chỉnh sửa IP address:

```dart
static const String _androidLocalUrl = 'http://YOUR_IP:5000/api';
```

### Chạy app

```bash
# Android
flutter run

# iOS  
flutter run -d ios

# Với custom API URL
flutter run --dart-define=API_URL=https://your-server.com/api
```

## Tính năng

| Tính năng | Màn hình |
|---|---|
| 🔐 Đăng nhập / Đăng ký | Login, Register, Forgot, Verify, Recovery |
| 🏠 Trang chủ | Home - mood selector, chart, quick actions |
| 🤖 SOUL AI Chat | AI chat với session history |
| 📖 Nhật ký cảm xúc | Diary list, stats, write form |
| 📊 Bài test tâm lý | WHO-5, PSS-10 assessment + results |
| 📅 Sự kiện | Events list, detail, registration, rating |
| 💬 Cộng đồng | Forum posts, reactions, create post |

## Stack kỹ thuật

- **State**: `flutter_riverpod` (tương đương Zustand)
- **Navigation**: `go_router` (tương đương Expo Router)
- **HTTP**: `dio` (tương đương axios)
- **Storage**: `shared_preferences` (tương đương AsyncStorage)

## Backend

App kết nối tới cùng backend Node.js/Express với React Native app.
API base URL mặc định: `http://192.168.2.43:5000/api`
