const paths: Record<string, string> = {
  queue: 'M4 5h16v14H4z M8 9h8 M8 13h5',
  proposal: 'M9 18h6 M10 21h4 M8 14a6 6 0 1 1 8 0l-1 2H9z',
  consultation: 'M4 4h16v13H9l-5 4z M8 8h8 M8 12h5',
  action: 'm14 3-2 7H5l5 4-2 7 11-12h-7z',
  territory: 'm3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z M9 3v15 M15 6v15',
  about: 'M12 16v-5 M12 7h.01 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
};
export function NavIcon({ name }: { name: string }) {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] || paths.about} />
    </svg>
  );
}
