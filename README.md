# Rigveda Digital Explorer

A modern, responsive web application for exploring, searching, and studying the ancient texts of the Rigveda. This application provides a user-friendly interface to delve into the 10 Mandalas, 1,028 Suktas, and 10,552 verses of this foundational Vedic Sanskrit text.

## ✨ Features

*   **Complete Rigveda Text:** Browse all 10 Mandalas, 1,028 Suktas, and 10,552 verses.
*   **Hierarchical Navigation:** Easily navigate from Mandalas to individual Suktas and verses through an intuitive, structured layout.
*   **Powerful Universal Search:** Instantly search across the entire Rigveda for specific terms, phrases, deities, or concepts.
*   **Random Verse Discovery:** Discover a new, random verse from the Rigveda on the homepage to spark curiosity and daily learning.
*   **In-built Sanskrit Dictionary:** Look up the meanings of Sanskrit words directly within the application to aid in study and comprehension.
*   **Ask the AI:** An integrated AI assistant to answer questions and provide deeper insights and context for the verses.
*   **Responsive Design:** Fully accessible and optimized for a seamless experience on desktop, tablet, and mobile devices.
*   **Light & Dark Mode:** Switch between light and dark themes for comfortable reading in any environment.

## 🚀 Tech Stack

*   **Framework:** [Next.js](https://nextjs.org/) (App Router)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **UI Library:** [React](https://react.dev/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Linting:** [ESLint](https://eslint.org/)
*   **Data:** JSON data files processed from original sources.

## 📂 Project Structure

The project is a standard Next.js application utilizing the App Router architecture.

```
rigveda-app/
├── public/          # Static assets (e.g., favicons)
├── scripts/         # Data processing scripts (e.g., parseHymns.js)
├── src/
│   ├── app/         # Next.js App Router directory
│   │   ├── api/     # API routes for search, dictionary, AI chat, etc.
│   │   ├── components/ # Reusable React components for UI elements
│   │   ├── data/    # JSON files containing the Rigveda text
│   │   ├── [mandala]/ # Dynamic routes for displaying Mandalas and Suktas
│   │   └── layout.tsx & page.tsx # Root layout and home page
│   ├── lib/         # Library functions (e.g., RAG logic)
│   └── types/       # TypeScript type definitions
└── package.json     # Project dependencies and scripts
```

## 🛠️ Getting Started

Follow these instructions to set up and run a local instance of the project.

### Prerequisites

*   Node.js (v18 or later recommended)
*   npm (or yarn/pnpm)

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/rigveda.git
    ```
2.  **Navigate to the application directory:**
    ```sh
    cd rigveda/rigveda-app
    ```
3.  **Install dependencies:**
    ```sh
    npm install
    ```
4.  **Run the development server:**
    ```sh
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## 📜 Data

The complete text of the Rigveda is stored in JSON format within the `src/data` directory, with each Mandala in its own file. The `scripts/parseHymns.js` script was used to process and structure this data from its original source into a clean, usable format for the application.

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request
