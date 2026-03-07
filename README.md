# FormatNow - Research Paper Formatting Platform

FormatNow is a premium web platform designed to automate the conversion of research papers into conference-ready LaTeX and PDF documents. It supports Markdown, DOCX, and ZIP uploads, providing high-fidelity formatting based on conference templates.

## ✨ Features

- **Professional Blue Theme**: Sleek, academic-focused interface with glassmorphism and animations.
- **Robust ZIP Support**: Upload entire project folders with figures and assets.
- **Automated Formatting**: Uses Pandoc for high-fidelity conversion.
- **Smart Validation**: Server-side checks for file integrity and security.
- **Tailored Results**: Dedicated results page with smart download links.

## 🚀 Getting Started

### Prerequisites

1.  **Node.js**: Ensure you have Node.js (v18+) installed.
2.  **Pandoc**: The document processing engine.
    - Install on macOS: `brew install pandoc`
    - Install on Ubuntu: `sudo apt-get install pandoc`
3.  **LaTeX (Optional but Recommended)**: Required for direct PDF generation.
    - Install BasicTeX or MacTeX on macOS.
    - Without LaTeX, the platform will gracefully fall back to providing the **LaTeX Source Code (.tex)**.

### Installation

1.  Clone the repository and navigate to the project root.
2.  Install dependencies:
    ```bash
    npm install
    ```

### Running Locally

1.  Start the development server:
    ```bash
    npm run dev
    ```
2.  Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🛠️ Usage

1.  **Landing Page**: Click "Get Started" to enter the workspace.
2.  **Upload**: 
    - **Research Paper**: Upload a `.md`, `.docx`, or a `.zip` containing your paper and images.
    - **Template**: Upload a conference `.tex` or `.cls` template.
3.  **Format**: Click "Format Paper".
4.  **Download**: Once processing is complete, you'll be redirected to the results page to download your formatted document.

## 📂 Project Structure

- `/app`: Next.js App Router (pages and API routes).
- `/components`: Reusable UI components (FileUploader, Navbar).
- `/lib`: Document processing logic (Pandoc integration).
- `/styles`: Global CSS and design system.
- `/tmp`: Temporary directories for file handling.

## 📄 License & Credits

**Ideation and prototype developed by Ketaki Paranjape.**

This project is licensed under the MIT License.



Push the code manually: Open your terminal in the project folder and run: git push -u origin main (You'll likely need to use a GitHub Personal Access Token as your password).
Deploy on Vercel Dashboard: Once the code is on GitHub, go to vercel.com, click "Add New" -> "Project", and select the FormatNowAG repo. It will automatically detect the Next.js settings and deploy it for you!