import type { ReactNode } from 'react';

export function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}): JSX.Element {
  return (
    <section className="lf-section">
      <h2 className="lf-section__title">{title}</h2>
      {description ? <p className="lf-section__description">{description}</p> : null}
      <div className="lf-section__body">{children}</div>
    </section>
  );
}
