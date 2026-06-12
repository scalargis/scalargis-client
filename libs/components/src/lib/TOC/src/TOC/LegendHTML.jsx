export default function LegendHTML({ data, core, actions, models }) {
  return (
    <div className="legend-container">
      <div dangerouslySetInnerHTML={{ __html: data?.legend_html || '' }} />
    </div>
  )
}