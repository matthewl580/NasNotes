# Nasnotes 📝✨

**A modern, open-source, and customizable note-taking PWA built with Next.js, Firebase, and AI.**

Nasnotes is a powerful and flexible note-taking application designed for the modern user. It combines a beautiful, intuitive interface with powerful features like real-time collaboration, rich media support, and AI-powered assistance. Whether you're capturing quick thoughts, sketching ideas, or organizing complex projects, Nasnotes provides the tools you need to keep your ideas in one place.


---

## ✨ Features

Nasnotes is packed with features to help you stay organized and productive:

-   **Robust Search**: Quickly find notes by keywords or tags.
-   **Flexible Organization**: Organize your notes with a tag-based system on an infinite canvas.
-   **Rich Text & Markdown**: Format your notes with a full-featured text editor that supports Markdown.
-   **Multi-Media Support**: Embed images and add sketches directly to your notes.
-   **Offline Mode**: Create, edit, and view notes even without an internet connection. Changes sync automatically when you're back online.
-   **AI-Powered Summarization**: Use AI to summarize long notes into concise points.
-   **AI-Powered Note Combination**: Combine multiple notes into a single, cohesive summary.
-   **Customization**: Personalize your workspace with different note colors and light/dark modes.
-   **Handwriting and Sketching**: A built-in drawing canvas lets you sketch ideas or handwrite notes.
-   **Real-time Syncing**: All your notes are saved and synced in real-time across your devices using Firebase.

## 🚀 Tech Stack

This project is built with a modern, production-ready tech stack:

-   **Framework**: [Next.js](https://nextjs.org/) (App Router)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **UI**: [React](https://react.dev/) & [ShadCN UI](https://ui.shadcn.com/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Backend & Database**: [Firebase](https://firebase.google.com/) (Firestore & Authentication)
-   **Generative AI**: [Genkit](https://firebase.google.com/docs/genkit) with Google Gemini models

## 🛠️ Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

-   [Node.js](https://nodejs.org/) (version 18 or later)
-   npm or yarn

### Installation

1.  **Clone the repo**
    ```sh
    git clone https://github.com/your-username/nasnotes.git
    ```
2.  **Navigate to the project directory**
    ```sh
    cd nasnotes
    ```
3.  **Install NPM packages**
    ```sh
    npm install
    ```
4.  **Set up environment variables**
    -   Create a `.env` file in the root of your project.
    -   Add your Firebase project configuration and your Gemini API key:
        ```env
        # Firebase Config - Replace with your project's credentials
        NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
        NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123...
        NEXT_PUBLIC_FIREBASE_APP_ID=1:123...

        # Genkit/Gemini Config
        GEMINI_API_KEY=AIza...
        ```
5.  **Run the development server**
    ```sh
    npm run dev
    ```

The application should now be running on [http://localhost:9002](http://localhost:9002).

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
