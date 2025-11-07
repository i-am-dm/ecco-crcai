/**
 * Component Showcase Example
 *
 * This file demonstrates all the shadcn/ui components and custom components
 * integrated into the CityReach Innovation Labs app.
 */

import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Textarea,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  StatusBadge,
  StatCard,
  EntityCard,
  LoadingState,
  EmptyState,
} from '@/components';
import {
  DollarSign,
  TrendingUp,
  Users,
  Package,
  Inbox,
} from 'lucide-react';

export function ComponentShowcase() {
  return (
    <div className="max-w-7xl mx-auto p-8 space-y-12">
      <div>
        <h1 className="text-3xl font-bold mb-2">Component Showcase</h1>
        <p className="text-slate-600 dark:text-slate-400">
          All shadcn/ui and custom components for CityReach Innovation Labs
        </p>
      </div>

      {/* Buttons */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Buttons</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="link">Link</Button>
          <Button variant="primary" size="sm">
            Small
          </Button>
          <Button variant="primary" size="lg">
            Large
          </Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
        </div>
      </section>

      {/* Status Badges */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Status Badges</h2>
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-medium mb-2">Venture Stages</h3>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status="Idea" />
              <StatusBadge status="Validation" />
              <StatusBadge status="Build" />
              <StatusBadge status="Pilot" />
              <StatusBadge status="Scale" />
              <StatusBadge status="Spin-Out" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-2">Health States</h3>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status="Active" />
              <StatusBadge status="At Risk" />
              <StatusBadge status="Critical" />
              <StatusBadge status="Paused" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-2">Task States</h3>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status="Complete" />
              <StatusBadge status="In Progress" />
              <StatusBadge status="Blocked" />
              <StatusBadge status="Pending" />
            </div>
          </div>
        </div>
      </section>

      {/* Stat Cards */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Stat Cards</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Revenue"
            value="$125,000"
            change={{ value: '+12%', trend: 'up' }}
            icon={DollarSign}
            variant="success"
            description="vs. last month"
          />
          <StatCard
            label="Active Ventures"
            value={24}
            change={{ value: '+3', trend: 'up' }}
            icon={Package}
            variant="brand"
          />
          <StatCard
            label="Team Members"
            value={42}
            icon={Users}
            variant="default"
          />
          <StatCard
            label="Churn Rate"
            value="2.4%"
            change={{ value: '-0.5%', trend: 'down' }}
            icon={TrendingUp}
            variant="warning"
          />
        </div>
      </section>

      {/* Entity Cards */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Entity Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <EntityCard
            id="V001"
            title="AI-Powered Analytics Platform"
            subtitle="Last updated 2 days ago"
            status="Build"
            metadata={[
              { label: 'Lead', value: 'Alice Johnson' },
              { label: 'MRR', value: '$12.5K' },
            ]}
            footer="Next: MVP Launch (14 days)"
            onClick={() => alert('Card clicked!')}
          />
          <EntityCard
            id="V002"
            title="Sustainable Energy Solutions"
            subtitle="Last updated 5 days ago"
            status="Scale"
            metadata={[
              { label: 'Lead', value: 'Bob Smith' },
              { label: 'MRR', value: '$45K' },
            ]}
            footer="Next: Series A (30 days)"
          />
          <EntityCard
            id="I042"
            title="Blockchain Supply Chain"
            subtitle="Created yesterday"
            status="Idea"
            metadata={[
              { label: 'Score', value: '8.5/10' },
              { label: 'Submitted by', value: 'Carol Davis' },
            ]}
          />
        </div>
      </section>

      {/* Form Elements */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Form Elements</h2>
        <Card>
          <CardHeader>
            <CardTitle>Create Venture</CardTitle>
            <CardDescription>
              Fill out the form to create a new venture
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Venture Name</Label>
              <Input id="name" placeholder="Enter venture name" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stage">Stage</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="idea">Idea</SelectItem>
                  <SelectItem value="validation">Validation</SelectItem>
                  <SelectItem value="build">Build</SelectItem>
                  <SelectItem value="pilot">Pilot</SelectItem>
                  <SelectItem value="scale">Scale</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the venture..."
                rows={4}
              />
            </div>

            <div className="flex gap-3">
              <Button variant="primary">Create Venture</Button>
              <Button variant="outline">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Table */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Data Table</h2>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead className="text-right">MRR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">V001</TableCell>
                  <TableCell>AI Analytics</TableCell>
                  <TableCell>
                    <StatusBadge status="Build" />
                  </TableCell>
                  <TableCell className="text-right">$12,500</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">V002</TableCell>
                  <TableCell>Energy Solutions</TableCell>
                  <TableCell>
                    <StatusBadge status="Scale" />
                  </TableCell>
                  <TableCell className="text-right">$45,000</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">V003</TableCell>
                  <TableCell>HealthTech Platform</TableCell>
                  <TableCell>
                    <StatusBadge status="Pilot" />
                  </TableCell>
                  <TableCell className="text-right">$8,200</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      {/* Tabs */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Tabs</h2>
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Overview content goes here
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="metrics" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Metrics content goes here
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="team" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Team content goes here
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      {/* Dialog */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Dialog</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="primary">Open Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Venture</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this venture? This action cannot
                be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline">Cancel</Button>
              <Button variant="danger">Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>

      {/* Loading States */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Loading States</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium mb-2">Card Loading</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <LoadingState variant="card" count={3} />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-2">Stat Loading</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <LoadingState variant="stat" count={4} />
            </div>
          </div>
        </div>
      </section>

      {/* Empty State */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Empty State</h2>
        <EmptyState
          icon={Inbox}
          title="No ventures yet"
          description="Get started by creating your first venture to begin tracking progress and managing resources."
          action={{
            label: 'Create Venture',
            onClick: () => alert('Create venture clicked'),
          }}
          secondaryAction={{
            label: 'Learn More',
            onClick: () => alert('Learn more clicked'),
          }}
        />
      </section>
    </div>
  );
}
