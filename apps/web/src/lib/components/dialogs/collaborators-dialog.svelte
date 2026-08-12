<script lang="ts">
import SelectGroup from '@lib/components/ui/select/select-group.svelte';
import SelectGroupHeading from '@lib/components/ui/select/select-group-heading.svelte';
import { getCollaboratorsContext } from '@nota/client';
import { BarSpinner, icons } from '@nota/ui/icons';
import { Button } from '@nota/ui/shadcn/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@nota/ui/shadcn/dialog';
import { Input } from '@nota/ui/shadcn/input';
import { Label } from '@nota/ui/shadcn/label';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@nota/ui/shadcn/select';
import { toast } from '@nota/ui/shadcn/sonner';
import UserAvatar from '../custom/user-avatar.svelte';

const { noteId } = $props<{ noteId: string }>();

const collaborators = getCollaboratorsContext();

let email = $state('');
let role = $state('editor');
let open = $state(false);

// Load members when opened
$effect(() => {
  if (open && noteId) {
    collaborators.fetchMembers(noteId).catch(console.error);
  }
});

async function handleAdd() {
  if (!email) return;
  try {
    await collaborators.addMember(noteId, email, role);
    email = '';
    toast.success('Collaborator added');
  } catch (e: any) {
    toast.error(e.message || 'Failed to add collaborator');
  }
}

async function handleRemove(collabId: string) {
  try {
    await collaborators.removeMember(noteId, collabId);
    toast.success('Collaborator removed');
  } catch (e: any) {
    toast.error(e.message || 'Failed to remove collaborator');
  }
}

async function handleRoleChange(collabId: string, newRole: string) {
  try {
    await collaborators.updateRole(noteId, collabId, newRole);
    toast.success('Role updated');
  } catch (e: any) {
    toast.error(e.message || 'Failed to update role');
  }
}
</script>

<Dialog bind:open>
  <DialogTrigger>
    <Button variant="outline" size="sm" class="gap-2">
      <icons.Users class="w-4 h-4" />
      Share
    </Button>
  </DialogTrigger>
  <DialogContent class="sm:max-w-110">
    <DialogHeader>
      <DialogTitle>Share Note</DialogTitle>
    </DialogHeader>

    <div class="grid gap-4 py-4">
      <div class="flex items-end gap-2">
        <div class="grid flex-1 gap-2">
          <Label for="email">Invite by email</Label>
          <Input
            id="email"
            bind:value={email}
            placeholder="jane@example.com"
            type="email"
          />
        </div>
        <div class="w-30">
          <Select type="single" bind:value={role}>
            <SelectTrigger>
              <span>{role}</span>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectGroupHeading>Role</SelectGroupHeading>
                <SelectItem value="viewer">Viewer</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <Button
          size="icon"
          onclick={handleAdd}
          disabled={collaborators.isLoading || !email}
        >
          {#if collaborators.isLoading}
            <BarSpinner />
          {:else}
            <icons.UserPlus />
          {/if}
        </Button>
      </div>

      <div class="mt-4 space-y-4">
        <h4 class="text-sm font-medium">People with access</h4>
        {#if collaborators.isLoading && collaborators.members.length === 0}
          <div class="flex justify-center p-4">
            <BarSpinner />
          </div>
        {:else if collaborators.members.length === 0}
          <p class="text-sm text-muted-foreground">Only you have access.</p>
        {:else}
          {#each collaborators.members as member (member.id)}
            <div class="flex items-center justify-between space-x-4">
              <div class="flex items-center space-x-4">
                <UserAvatar
                  image={member.avatar_url ?? ""}
                  name={member.name ?? "Unknown"}
                />
                <div class="flex flex-col">
                  <span class="text-sm font-medium leading-none">
                    {member.name || "Unknown"}
                  </span>
                  <span class="text-sm text-muted-foreground"
                    >{member.email}</span
                  >
                </div>
              </div>
              <div class="flex items-center gap-2">
                <Select
                  type="single"
                  bind:value={member.role}
                  onValueChange={(v) => handleRoleChange(member.id, v)}
                >
                  <SelectTrigger>
                    <span>{member.role}</span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectGroupHeading>Role</SelectGroupHeading>
                      <SelectItem value="viewer">Viewer</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Button
                  variant="destructive"
                  size="icon"
                  onclick={() => handleRemove(member.id)}
                >
                  <icons.Trash2 />
                </Button>
              </div>
            </div>
          {/each}
        {/if}
      </div>
    </div>
  </DialogContent>
</Dialog>
