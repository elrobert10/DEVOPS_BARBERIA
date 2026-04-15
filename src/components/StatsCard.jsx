export default function StatCard({ title, value }) {
  return (
    <div className="
      bg-barber-white
      border border-barber-gray
      rounded-xl
      p-5
      shadow-sm
    ">
      <p className="text-sm text-barber-gray">
        {title}
      </p>

      <h2 className="text-3xl font-bold mt-2 text-barber-gold">
        {value}
      </h2>
    </div>
  );
}
