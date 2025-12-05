import "./SectionCard.css";

type SectionCardProps = {
  title: string;
  description: string;
  items: string[];
};

export function SectionCard({ title, description, items }: SectionCardProps) {
  return (
    <section className="card">
      <div className="card__header">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <ul className="card__list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}


