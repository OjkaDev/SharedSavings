export default function StatCard({ name, value, icon: Icon, gradient, subtitle }) {
  return (
    <div className="card p-3 md:p-5 flex flex-col text-center">
      <p className="text-dark-300 text-xs md:text-sm font-medium mb-2 md:mb-3">{name}</p>
      <div className="flex items-center justify-center gap-1 md:gap-2 mb-1 md:mb-2">
        <div className={`w-6 h-6 md:w-8 md:h-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center`}>
          <Icon className="h-3 w-3 md:h-4 md:w-4 text-white" />
        </div>
        <p className="text-lg md:text-2xl font-bold text-white">{value}</p>
      </div>
      {subtitle && <p className="text-dark-500 text-xs">{subtitle}</p>}
    </div>
  )
}
