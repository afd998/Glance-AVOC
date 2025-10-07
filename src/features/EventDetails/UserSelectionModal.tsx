import React from 'react';
import { useUserProfiles } from '../../core/User/useUserProfiles';
import UserAvatar from '../../core/User/UserAvatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../components/ui/dialog';
import {
  Item,
  ItemGroup,
  ItemSeparator,
  ItemMedia,
  ItemContent,
  ItemTitle,
} from '../../components/ui/item';

interface UserSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (userId: string) => void;
  title: string;
}

export default function UserSelectionModal({
  isOpen,
  onClose,
  onSelectUser,
  title
}: UserSelectionModalProps) {
  const { profiles, isLoading } = useUserProfiles();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="sr-only">Select a user</DialogDescription>
        </DialogHeader>

        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground">Loading users...</div>
          ) : profiles && profiles.length > 0 ? (
            <ItemGroup>
              {profiles.map((profile, idx) => (
                <React.Fragment key={profile.id}>
                  <Item
                    className="cursor-pointer hover:bg-accent/40"
                    onClick={() => {
                      onSelectUser(profile.id);
                      onClose();
                    }}
                  >
                    <ItemMedia>
                      <UserAvatar userId={profile.id} size="sm" />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>
                        {profile.name || profile.id}
                      </ItemTitle>
                    </ItemContent>
                  </Item>
                  {idx < profiles.length - 1 && <ItemSeparator />}
                </React.Fragment>
              ))}
            </ItemGroup>
          ) : (
            <div className="text-center py-4 text-muted-foreground">No users found</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 