const items = [{ id: 1 }, { id: 2 }, { id: 3 }]

export default function Example() {
  return (
    <ul role="list" className="divide-y divide-gray-200 dark:divide-white/10">
      {items.map((item) => (
        <li key={item.id} className="py-4">
          {/* Your content */}
        </li>
      ))}
    </ul>
  )
}
