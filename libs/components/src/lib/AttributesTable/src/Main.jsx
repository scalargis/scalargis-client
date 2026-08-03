import React, { useState } from 'react'
import { ActionIcon, Modal, TextInput } from '@mantine/core'
import { DataGrid } from '@scalargis/ui'

export default function Main({ open, as, onOpen, onClose, data, fields }) {

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(4);
  const [sortStatus, setSortStatus] = useState(null);
  const [filters, setFilters] = useState({});

  if (as === 'button') return (
    <ActionIcon
      variant="subtle"
      size="md"
      radius="xl"
      className="tool"
      title="Tabela de atributos"
      aria-label="Tabela de atributos"
      onClick={e => onOpen(true)}
    >
      <i className="pi pi-table" aria-hidden="true" />
    </ActionIcon>
  )

  // Client-side pipeline: filter, sort, then slice the page. The page is
  // clamped on derive so a narrowed result set never strands the paginator.
  let records = (data || []);
  Object.entries(filters).forEach(([name, query]) => {
    if (query) {
      const q = String(query).toLowerCase();
      records = records.filter(row => String(row[name] ?? '').toLowerCase().includes(q));
    }
  });
  if (sortStatus) {
    records = [...records].sort((a, b) => {
      const av = a[sortStatus.columnAccessor];
      const bv = b[sortStatus.columnAccessor];
      if (av == null && bv == null) return 0;
      if (av == null) return -1;
      if (bv == null) return 1;
      if (typeof av === 'number' && typeof bv === 'number') return av - bv;
      return String(av).localeCompare(String(bv));
    });
    if (sortStatus.direction === 'desc') records.reverse();
  }
  const totalPages = Math.max(1, Math.ceil(records.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRecords = records
    .slice((currentPage - 1) * pageSize, currentPage * pageSize)
    .map((row, i) => ({ ...row, __row: (currentPage - 1) * pageSize + i }));

  const columns = fields.map(field => ({
    accessor: field.name,
    title: field.label,
    sortable: field.type !== 'url',
    ...(field.type !== 'url' ? {
      filter: (
        <TextInput
          label={field.label}
          placeholder={"Procurar por " + field.label.toLowerCase()}
          size="sm"
          value={filters[field.name] || ''}
          onChange={(e) => {
            setFilters({ ...filters, [field.name]: e.currentTarget.value });
            setPage(1);
          }}
        />
      ),
      filtering: !!filters[field.name],
    } : {}),
    render: row =>
      field.type === 'url' ?
        <div>
          <a href={row[field.name]} title={row[field.name]} target="_blank" rel="noopener noreferrer">
            <i className="pi pi-external-link"></i>
          </a>
        </div>
      : row[field.name],
  }));

  return (
      <Modal
          title="Tabela de Attributos"
          opened={open}
          size="50vw"
          onClose={e => onClose(false)}>
            <DataGrid
              idAccessor="__row"
              records={pageRecords}
              columns={columns}
              totalRecords={records.length}
              page={currentPage}
              onPageChange={(p) => setPage(p)}
              recordsPerPage={pageSize}
              recordsPerPageOptions={[2, 4]}
              onRecordsPerPageChange={(size) => { setPageSize(size); setPage(1); }}
              recordsPerPageLabel="Registos"
              paginationText={({ from, to, totalRecords: total }) =>
                `A mostrar de ${from} até ${to} de um total de ${total}`}
              sortStatus={sortStatus || undefined}
              onSortStatusChange={(status) => { setSortStatus(status); setPage(1); }}
            />
          </Modal>
  )
}
