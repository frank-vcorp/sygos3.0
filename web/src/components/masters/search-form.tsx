type SearchFormProps = {
  action: string;
  defaultValue?: string;
  placeholder?: string;
};

export function SearchForm({
  action,
  defaultValue = "",
  placeholder = "Buscar…",
}: SearchFormProps) {
  return (
    <form action={action} method="get" className="flex gap-2">
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Buscar
      </button>
    </form>
  );
}
