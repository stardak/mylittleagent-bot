const items = [{ id: 1 }, { id: 2 }, { id: 3 }]

export default function Example() {
  return (
    <ul role="list" className="space-y-3">
      {items.map((item) => (
        <li
          key={item.id}
          className="overflow-hidden bg-white px-4 py-4 shadow-sm sm:rounded-md sm:px-6 dark:bg-gray-800/50 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10"
        >
          {/* Your content */}
        </li>
      ))}
    </ul>
  )
}
