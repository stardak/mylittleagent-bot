const items = [{ id: 1 }, { id: 2 }, { id: 3 }]

export default function Example() {
  return (
    <ul role="list" className="divide-y divide-gray-200 dark:divide-white/10">
      {items.map((item) => (
        <li key={item.id} className="px-4 py-4 sm:px-0">
          {/* Your content */}
        </li>
      ))}
    </ul>
  )
}
