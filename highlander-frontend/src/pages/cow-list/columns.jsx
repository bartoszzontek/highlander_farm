// src/pages/cow-list/columns.jsx
import React from "react"
import { Checkbox } from "../../components/ui/checkbox"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { ArrowUpDown } from "lucide-react"

// Ikony akcji
import { Edit2, Trash2, PlusCircle, Eye } from 'lucide-react'

// Funkcje pomocnicze
const ageLabel = (age) => (age === 1 ? 'rok' : (age >= 2 && age <= 4 ? 'lata' : 'lat'));

export const getColumns = ({ onEdit, onDelete, onAddEvent, onNavigate }) => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Zaznacz wszystko"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Zaznacz wiersz"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "tag_id",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Kolczyk
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="font-mono text-emerald-700 dark:text-emerald-300">{row.getValue("tag_id")}</div>,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Imię
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
  },
  {
    accessorKey: "gender",
    header: "Płeć",
    cell: ({ row }) => {
      const gender = row.getValue("gender")
      return <Badge variant={gender === 'F' ? "default" : "secondary"}>{gender === 'F' ? '♀ Samica' : '♂ Samiec'}</Badge>
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "age",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Wiek
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div>{row.getValue("age")} {ageLabel(row.getValue("age"))}</div>,
  },
  {
    accessorKey: "breed",
    header: "Rasa",
  },
  {
    id: "actions",
    header: () => <div className="text-right">Akcje</div>,
    cell: ({ row }) => {
      const cow = row.original
      
      // === POPRAWKA: Renderujemy ikony bezpośrednio ===
      return (
        <div className="flex items-center justify-end space-x-1">
          <Button variant="ghost" size="icon" title="Szczegóły / Historia" onClick={() => onNavigate(cow)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" title="Dodaj zdarzenie" onClick={() => onAddEvent(cow)}>
            <PlusCircle className="h-4 w-4 text-blue-600" />
          </Button>
          <Button variant="ghost" size="icon" title="Edytuj" onClick={() => onEdit(cow)}>
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" title="Usuń" className="text-red-600 hover:text-red-700" onClick={() => onDelete(cow)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    },
    enableSorting: false,
    enableHiding: false,
  },
]
