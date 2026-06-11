type SpecTableProps = {
  rows: Array<[string, string]>;
};

export function SpecTable({ rows }: SpecTableProps) {
  return (
    <table className="cs-spec-table">
      <tbody>
        {rows.map(([key, value]) => (
          <tr key={key}>
            <th scope="row">{key}</th>
            <td>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
