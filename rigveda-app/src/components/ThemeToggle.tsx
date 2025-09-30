'use client';

export default function ThemeToggle() {
  const handleClick = () => {
    const root = document.documentElement;
    if (root.classList.contains('dark')) root.classList.remove('dark');
    else root.classList.add('dark');
  };

  return (
    <button
      className="text-sm px-3 py-1.5 rounded-md border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10"
      onClick={handleClick}
    >
      Toggle theme
    </button>
  );
}
