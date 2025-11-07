# Component Quick Reference

Quick copy-paste snippets for common UI patterns in CityReach Innovation Labs.

## Import Statement

```tsx
// Import everything you need
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Input,
  Label,
  Select,
  StatusBadge,
  StatCard,
  EntityCard,
  LoadingState,
  EmptyState,
} from '@/components';
```

## Common Patterns

### Page Layout

```tsx
function VenturesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Ventures</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage your active ventures
          </p>
        </div>
        <Button variant="primary">
          Create Venture
        </Button>
      </div>

      {/* Content */}
    </div>
  );
}
```

### Dashboard Stats Row

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <StatCard
    label="Total Revenue"
    value="$125,000"
    change={{ value: '+12%', trend: 'up' }}
    icon={DollarSign}
    variant="success"
  />
  <StatCard
    label="Active Ventures"
    value={24}
    change={{ value: '+3', trend: 'up' }}
    icon={Package}
    variant="brand"
  />
  {/* More stats... */}
</div>
```

### Entity Grid

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {ventures.map((venture) => (
    <EntityCard
      key={venture.id}
      id={venture.ventureId}
      title={venture.name}
      subtitle={`Updated ${formatDate(venture.updatedAt)}`}
      status={venture.stage}
      metadata={[
        { label: 'Lead', value: venture.lead },
        { label: 'MRR', value: formatCurrency(venture.mrr) },
      ]}
      href={`/ventures/${venture.id}`}
    />
  ))}
</div>
```

### Data Table

```tsx
<Card>
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>ID</TableHead>
        <TableHead>Name</TableHead>
        <TableHead>Status</TableHead>
        <TableHead className="text-right">Value</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {data.map((item) => (
        <TableRow key={item.id}>
          <TableCell className="font-medium">{item.id}</TableCell>
          <TableCell>{item.name}</TableCell>
          <TableCell>
            <StatusBadge status={item.status} />
          </TableCell>
          <TableCell className="text-right tabular-nums">
            {item.value}
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</Card>
```

### Form with Validation

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  stage: z.string(),
  description: z.string().optional(),
});

function VentureForm() {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', stage: '', description: '' },
  });

  const onSubmit = (data) => {
    console.log(data);
    toast.success('Venture created!');
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Create</Button>
      </form>
    </Form>
  );
}
```

### Loading State

```tsx
function VenturesPage() {
  const { data, isLoading } = useQuery('ventures', fetchVentures);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <LoadingState variant="card" count={6} />
      </div>
    );
  }

  return <div>{/* Render data */}</div>;
}
```

### Empty State

```tsx
{ventures.length === 0 ? (
  <EmptyState
    icon={Package}
    title="No ventures yet"
    description="Get started by creating your first venture."
    action={{
      label: 'Create Venture',
      onClick: () => navigate('/ventures/new'),
    }}
  />
) : (
  <div>{/* Render ventures */}</div>
)}
```

### Confirmation Dialog

```tsx
function DeleteButton({ ventureId }) {
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    await deleteVenture(ventureId);
    toast.success('Venture deleted');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="danger">Delete</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Venture</DialogTitle>
          <DialogDescription>
            Are you sure? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### Tab Navigation

```tsx
<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="metrics">Metrics</TabsTrigger>
    <TabsTrigger value="team">Team</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">
    <Card>
      <CardContent className="pt-6">
        {/* Overview content */}
      </CardContent>
    </Card>
  </TabsContent>
  {/* Other tabs... */}
</Tabs>
```

### Dropdown Menu

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components';
import { MoreVertical } from 'lucide-react';

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon">
      <MoreVertical className="w-4 h-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={handleEdit}>
      Edit
    </DropdownMenuItem>
    <DropdownMenuItem onClick={handleDuplicate}>
      Duplicate
    </DropdownMenuItem>
    <DropdownMenuItem onClick={handleDelete} className="text-red-600">
      Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Toast Notifications

```tsx
import { toast } from 'sonner';

// Success
toast.success('Changes saved successfully!');

// Error
toast.error('Failed to save changes');

// With action
toast('Venture deleted', {
  action: {
    label: 'Undo',
    onClick: () => console.log('Undo'),
  },
});

// Loading toast
const toastId = toast.loading('Saving...');
// Later:
toast.success('Saved!', { id: toastId });
```

### Responsive Grid

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {items.map((item) => (
    <Card key={item.id}>
      {/* Card content */}
    </Card>
  ))}
</div>
```

### Search and Filters

```tsx
<Card className="p-4 mb-6">
  <div className="flex flex-wrap gap-3 items-end">
    <div className="flex-1 min-w-[200px]">
      <Label htmlFor="search">Search</Label>
      <Input
        id="search"
        placeholder="Search ventures..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
    </div>
    <div className="w-[200px]">
      <Label htmlFor="status">Status</Label>
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger>
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="paused">Paused</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div className="flex gap-2">
      <Button variant="primary">Apply</Button>
      <Button variant="outline" onClick={clearFilters}>
        Clear
      </Button>
    </div>
  </div>
</Card>
```

### Detail Page Header

```tsx
<div className="mb-6">
  <div className="mb-4">
    <a
      href="/ventures"
      className="text-sm text-brand-600 hover:underline dark:text-brand-400"
    >
      ← Back to Ventures
    </a>
  </div>
  <Card>
    <CardHeader className="border-b border-slate-100 dark:border-slate-800">
      <div className="flex items-start justify-between">
        <div>
          <CardTitle className="text-2xl">{venture.ventureId}</CardTitle>
          <CardDescription>{venture.name}</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={venture.stage} />
          <Button variant="outline">Edit</Button>
        </div>
      </div>
    </CardHeader>
  </Card>
</div>
```

### Two-Column Layout

```tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  {/* Main content - 2/3 width */}
  <div className="lg:col-span-2 space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>Details</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Content */}
      </CardContent>
    </Card>
  </div>

  {/* Sidebar - 1/3 width */}
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>Quick Info</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Sidebar content */}
      </CardContent>
    </Card>
  </div>
</div>
```

## Color Classes

### Brand Colors
```tsx
// Backgrounds
bg-brand-50  bg-brand-100  bg-brand-500  bg-brand-600  bg-brand-900
// Text
text-brand-500  text-brand-600  text-brand-700
// Borders
border-brand-200  border-brand-300  border-brand-700
```

### Accent Colors
```tsx
// Backgrounds
bg-accent-50  bg-accent-100  bg-accent-500  bg-accent-600
// Text
text-accent-500  text-accent-600  text-accent-700
```

### Semantic Colors
```tsx
// Success (green)
bg-green-50  text-green-700  border-green-200
// Warning (amber)
bg-amber-50  text-amber-700  border-amber-200
// Error (red)
bg-red-50  text-red-700  border-red-200
// Info (blue)
bg-blue-50  text-blue-700  border-blue-200
```

## Spacing Scale

```tsx
// Gap between items
gap-2   // 8px
gap-3   // 12px
gap-4   // 16px
gap-6   // 24px
gap-8   // 32px

// Padding
p-4     // 16px all sides
p-6     // 24px all sides
px-4    // 16px horizontal
py-6    // 24px vertical

// Margin
mb-4    // 16px bottom
mt-6    // 24px top
mx-auto // center horizontally
```

## Typography

```tsx
// Headings
text-3xl font-bold          // Page title
text-2xl font-semibold      // Section heading
text-xl font-semibold       // Card title
text-lg font-medium         // Subsection

// Body text
text-base                   // 16px
text-sm                     // 14px
text-xs                     // 12px

// Colors
text-slate-900 dark:text-slate-100    // Primary text
text-slate-600 dark:text-slate-400    // Secondary text
text-slate-500 dark:text-slate-500    // Muted text
```

## Dark Mode Classes

Always include dark mode variants:
```tsx
className="
  bg-white dark:bg-slate-900
  text-slate-900 dark:text-slate-100
  border-slate-200 dark:border-slate-700
"
```

---

**Pro Tips:**
- Use `tabular-nums` for numeric values in tables
- Use `truncate` to prevent text overflow
- Use `max-w-7xl mx-auto` for centered page containers
- Use `sm:`, `md:`, `lg:` prefixes for responsive design
- Always add `dark:` variants for dark mode support
