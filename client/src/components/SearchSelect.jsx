// A searchable single-choice picker that queries the server as the user types, so it
// stays fast with thousands of records (a plain <select> would need every row loaded).
import { useEffect, useId, useRef, useState } from 'react';

const SEARCH_DELAY_MS = 250;

export default function SearchSelect({
  label,
  value,
  onChange,
  search,
  describe,
  placeholder = 'Type to search',
  error,
  disabled = false,
}) {
  const listId = useId();
  const rootRef = useRef(null);
  const [text, setText] = useState('');
  const [options, setOptions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState('');
  const [highlight, setHighlight] = useState(0);

  // Wait for a pause in typing, and ignore answers that arrive after a newer search.
  useEffect(() => {
    if (!open) return undefined;
    let active = true;
    setLoading(true);
    const timer = setTimeout(() => {
      search(text.trim())
        .then((items) => {
          if (!active) return;
          setOptions(items);
          setHighlight(0);
          setFailure('');
        })
        .catch((problem) => active && setFailure(problem.message || 'Could not load choices'))
        .finally(() => active && setLoading(false));
    }, SEARCH_DELAY_MS);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [open, text, search]);

  useEffect(() => {
    const close = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const choose = (option) => {
    onChange(option);
    setText('');
    setOpen(false);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setHighlight((current) => Math.min(current + 1, options.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlight((current) => Math.max(current - 1, 0));
    } else if (event.key === 'Enter' && open) {
      event.preventDefault();
      if (options[highlight]) choose(options[highlight]);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  const selected = value ? describe(value) : null;

  return (
    <div ref={rootRef} className="relative">
      <label className="label" htmlFor={`${listId}-input`}>
        {label}
      </label>
      <input
        id={`${listId}-input`}
        className={`input ${error ? 'input-error' : ''}`}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-invalid={Boolean(error)}
        autoComplete="off"
        maxLength={100}
        disabled={disabled}
        placeholder={selected && !open ? selected.title : placeholder}
        value={open ? text : (selected?.title ?? '')}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setText(event.target.value);
          setOpen(true);
        }}
        onKeyDown={handleKeyDown}
      />
      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          {loading && <li className="px-3 py-2 text-sm text-slate-500">Searching…</li>}
          {!loading && failure && <li className="px-3 py-2 text-sm text-red-600">{failure}</li>}
          {!loading && !failure && options.length === 0 && (
            <li className="px-3 py-2 text-sm text-slate-500">No matches. Try a different search.</li>
          )}
          {!loading &&
            options.map((option, index) => {
              const { title, detail } = describe(option);
              return (
                <li
                  key={option.id}
                  role="option"
                  aria-selected={value?.id === option.id}
                  className={`cursor-pointer px-3 py-2 text-sm ${
                    index === highlight ? 'bg-brand-50 text-brand-700' : 'text-slate-700'
                  }`}
                  onMouseEnter={() => setHighlight(index)}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    choose(option);
                  }}
                >
                  <span className="block font-medium">{title}</span>
                  {detail && <span className="block text-xs text-slate-500">{detail}</span>}
                </li>
              );
            })}
        </ul>
      )}
      {error && (
        <p className="mt-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
