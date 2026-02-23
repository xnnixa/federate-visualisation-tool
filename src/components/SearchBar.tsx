interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export const SearchBar = ({ value, onChange }: SearchBarProps) => (
  <div className="search-bar">
    <input
      type="search"
      placeholder="Search Building Blocks"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label="Search Building Blocks"
    />
  </div>
);
