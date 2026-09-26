# 🌙 Fibarakath - Your Islamic Companion App

**Fibarakath** is an Islamic mobile application with prayer times, Quran reading, and daily spiritual guidance for year-round use.

## ✨ Features

### 🕌 Prayer Times

- **Real-time Prayer Schedules**: Get accurate Fajr, Dhuhr, Asr, Maghrib, and Isha prayer times
- **Multi-City Support**: View prayer times for different cities across India
- **Beautiful UI**: Elegant gradient design with clear time displays

### 📖 FiBarakath

- **Complete Quran Access**: Browse all 114 Surahs of the Quran
- **Verse Details**: Read Ayahs with translations and transliterations
- **Verse of the Day**: Receive a unique daily Islamic verse with caching for offline access
- **Easy Navigation**: Intuitive interface to jump between chapters

### 🎯 Daily Companion

- **Spiritual Guidance**: A different daily verse in the app and in the 9 AM notification schedule
- **Prayer Tracking**: Keep track of all five daily prayers
- **Share Functionality**: Share verses and prayer times with family and friends
- **Responsive Design**: Works flawlessly on Android, iOS, and Web

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn** package manager
- **Expo CLI** (optional, but recommended)

### Installation

1. **Clone the repository**

    ```bash
    git clone <repository-url>
    cd fibarakath
    ```

2. **Install dependencies**

    ```bash
    npm install
    ```

3. **Start the development server**
    ```bash
    npm start
    ```

### Running on Different Platforms

**Android Emulator:**

```bash
npm run android
```

**iOS Simulator:** (macOS only)

```bash
npm run ios
```

**Web Browser:**

```bash
npm run web
```

**Expo Go App:** (Easiest option)

- Scan the QR code from the terminal output with the [Expo Go](https://expo.dev/go) app

## 📁 Project Structure

```
fibarakath/
├── app/                          # Main app screens (file-based routing)
│   ├── _layout.tsx              # Root layout with navigation
│   ├── index.tsx                # Home screen with prayer times & verse of day
│   ├── quran.tsx                # Quran browser screen
│   └── surah/[id].tsx           # Individual Surah detail view
├── src/
│   ├── api/
│   │   ├── prayer.ts            # Prayer times API integration
│   │   └── quran.ts             # Quran data API integration
│   ├── components/
│   │   ├── AyahCard.tsx         # Verse card component
│   │   └── TimeCard.tsx         # Prayer time card component
│   ├── constants/
│   │   └── cities.ts            # Supported cities data
│   └── types/
│       └── quran.ts             # TypeScript type definitions
├── assets/                       # Images, fonts, and media
├── package.json                 # Dependencies and scripts
└── tsconfig.json               # TypeScript configuration
```

## 🛠 Tech Stack

### Frontend Framework

- **React Native** - Cross-platform mobile development
- **Expo** - Managed React Native development platform
- **TypeScript** - Type-safe JavaScript

### Navigation & UI

- **Expo Router** - File-based routing system
- **React Navigation** - Navigation library with bottom tabs
- **Expo Linear Gradient** - Beautiful gradient backgrounds
- **React Native Icons** - Vector icons support

### Storage & State

- **AsyncStorage** - Local device storage for caching
- **React Hooks** - State management (useState, useEffect)

### APIs

- **Al-Quran Cloud API** - Comprehensive Quran data with translations
- **Aladhan Prayer Times API** - Accurate Islamic prayer times

## 📱 Features in Detail

### 🕐 Prayer Times Module

- Fetch and display prayer times based on user's city
- Support for multiple Indian cities
- Real-time updates

### 📚 Quran Module

- Access to all Quran chapters (Surahs)
- Verse-by-verse (Ayah) reading with English translation
- Daily verse of the day feature with local caching
- Fast and reliable data fetching

### 💾 Data Persistence

- Cache verses of the day to ensure offline availability
- Store prayer times locally for quick access
- Uses device's AsyncStorage for lightweight persistence

## � Upcoming Features

### 🎵 Audio Quran Playback

- **Listen to Quran**: Professional audio recitation with beautiful tilawah
- **Background Playback**: Continue listening even when your phone is locked
- **Surah-by-Surah Playback**: Listen to complete Surahs without interruption
- **Smart Controls**: Play, pause, and navigate through verses seamlessly
- **Quality Audio**: High-quality recitations from renowned Qaris

### 📿 Ready-Made Duas

- **Categorized Duas**: Pre-written dua collections for different purposes:
    - Morning & Evening Adhkar
    - Health & Recovery Duas
    - Success & Guidance Duas
    - Family & Relationships Duas
    - Work & Rizq Duas
    - Forgiveness & Mercy Duas
    - Travel & Safety Duas
- **Easy Access**: Quick search and filter functionality
- **Share & Bookmark**: Save favorite duas and share with loved ones
- **Arabic & Transliteration**: Learn authentic duas with proper pronunciation

Planned categories include duas for prayer, travel, eating, waking and sleeping, entering or leaving home, illness, and forgiveness.

### 📖 Offline Quran Reading

- **Complete Offline Mode**: Download and read the entire Quran without internet
- **Fast Access**: Instant loading of verses from local storage
- **Persistent Storage**: Quran data remains accessible even after app restarts
- **Bandwidth Friendly**: No ongoing data usage after initial download
- **Reliable Reading**: Never lose access to the holy Quran

## �🔧 Available Scripts

```bash
npm start        # Start development server
npm run android  # Run on Android emulator
npm run ios      # Run on iOS simulator
npm run web      # Run in web browser
npm run lint     # Run ESLint code quality checks
```

## 🌐 API Integration

### Prayer Times

```
GET https://api.aladhan.com/v1/timingsByCity?city={city}&country=India
```

### Quran Data

```
GET https://api.alquran.cloud/v1/surah              # Get all Surahs
GET https://api.alquran.cloud/v1/surah/{id}         # Get Surah details
GET https://api.alquran.cloud/v1/ayah/{number}/en.asad  # Get specific verse
```

## 📝 Development

### Code Quality

The project uses ESLint to maintain code quality and consistent formatting.

```bash
npm run lint
```

### Adding New Features

1. Create components in `src/components/`
2. Add API calls in `src/api/`
3. Define types in `src/types/`
4. Create new routes in the `app/` directory

## 🤝 Contributing

We welcome contributions to make Fibarakath even better! Here's how:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes and commit (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

## 📦 Dependencies Highlights

- **expo** (~54.0.33) - Development platform
- **react-native** (0.81.5) - Mobile framework
- **expo-router** (~6.0.23) - Navigation
- **expo-linear-gradient** - Visual effects
- **react-native-async-storage** - Local storage

## 🔐 Privacy & Security

- All prayer time data is fetched from secure HTTPS APIs
- Quran data is sourced from reputable Islamic servers
- Local storage is encrypted at the device level
- No personal data is collected or shared

## 📄 License

This project is open source and available under the MIT License.

## 🌟 Acknowledgments

- **Al-Quran Cloud** for providing comprehensive Quran data
- **Aladhan** for accurate prayer time calculations
- **Expo Community** for the excellent development tools
- **Islamic Community** for spiritual inspiration

## 📞 Support

For support, issues, or feature requests:

- Open an issue on GitHub
- Check existing documentation
- Consult the Expo and React Native communities

## 🙏 Duas & Blessings

May this application help you connect with the Quran and maintain your spiritual practice. May Allah accept from all of us. Ameen! 🤲

---

**Developed with ❤️ for the Muslim Community**
