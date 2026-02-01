# CaloriesTrecker

React Native (Expo) приложение для отслеживания калорий с AI-анализом еды.

## Требования

- Node.js >= 20
- Xcode (для iOS)
- CocoaPods

## Быстрый старт

### iOS

```bash
# Установка и сборка (одна команда)
npm run setup:ios

# Запуск
npm run ios
```

### Или по шагам

```bash
# 1. Установить зависимости
npm install

# 2. Сгенерировать нативный проект
npm run prebuild:ios

# 3. Запустить
npm run ios
```

## Структура проекта

```
src/
├── App.tsx           # Главный компонент
├── api/              # API вызовы
├── assets/           # Изображения, иконки
├── components/       # UI компоненты
├── hooks/            # React hooks
├── navigation/       # Навигация
├── plugins/          # Expo плагины
├── screens/          # Экраны
├── services/         # Сервисы (Adapty, Firebase)
├── store/            # Zustand stores
├── theme/            # Стили, цвета
├── types/            # TypeScript типы
└── utils/            # Утилиты
```

## Конфигурация

- `app.json` - Expo конфигурация
- `GoogleService-Info.plist` - Firebase (iOS)

## Скрипты

| Команда | Описание |
|---------|----------|
| `npm run setup:ios` | Полная установка для iOS |
| `npm run ios` | Запуск на iOS |
| `npm run prebuild:ios` | Генерация iOS проекта |
| `npm run lint` | Проверка кода |
