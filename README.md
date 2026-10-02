# SimpleStock - Home Inventory Assistant

SimpleStock is an intuitive, AI-powered home inventory and ledger application designed specifically for seniors and families. It simplifies the process of tracking groceries, medicines, household essentials, rental records, and customer interactions through a single, easy-to-use dashboard.

## 🚀 Core Features

### 1. Intelligent Inventory Management
- **Easy Tracking**: Add, view, and update items across categories like Groceries, Medicines, Vegetables, and Kitchen.
- **Visual Inventory**: Clean, card-based UI with large, accessible touch targets and high-contrast icons.
- **Real-time Sync**: Data is stored in Google Firebase Firestore, ensuring your inventory is always up-to-date across all devices.

### 2. Specialized Medicine Tracking
- **Dosage Configuration**: Set daily intake frequency (e.g., 2 times/day, 3 times/day).
- **Stock Monitoring**: Automatically tracks pill counts and alerts you when it's time to restock.

### 3. Smart Alerts & Notifications
- **Low Stock Alerts**: Automatically highlights items that fall below a configurable threshold (defaults to 10 units).
- **Dashboard Overview**: A minimalist home screen showing total items and critical stock alerts at a glance.

### 4. AI-Powered Assistant (Genkit & Gemini)
- **Voice Commands**: Add items using natural language (e.g., "I bought 2 liters of milk").
- **Intelligent Recognition**: The AI maps vague descriptions (e.g., "that white drink") to specific items (e.g., "Milk") and automatically identifies medicines.
- **Receipt OCR**: Take a photo of your grocery bill to automatically extract items, quantities, and track your spending.

### 5. Family Sharing & Collaboration
- **Member Invites**: Add family members via email to share your inventory.
- **Role-Based Access**: Configure roles like "Owner" (full control) or "Viewer" (read-only), perfect for kids helping parents manage their stock.

### 6. Accessibility & Localization
- **Multilingual**: Instant toggle between **English** and **Tamil (தமிழ்)** for all labels and instructions.
- **Senior-Friendly Design**: Large fonts, simple navigation, and calming color palettes to reduce visual clutter and eye strain.

## 🛠️ Technical Stack
- **Framework**: Next.js 15 (App Router)
- **Frontend**: React, Tailwind CSS, ShadCN UI
- **Backend**: Firebase Authentication, Firestore
- **AI Engine**: Genkit with Google Gemini 2.5 Flash
- **Icons**: Lucide React

## 🔒 Security & Privacy
- **Private Data**: Every user has their own secure data silo.
- **Cloud Hosted**: Hosted on the Firebase Spark (No-Cost) tier with generous limits for individual use.