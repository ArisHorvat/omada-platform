let viewingChannelId: string | null = null;

export const announcementViewState = {
  setViewingChannelId(id: string | null) {
    viewingChannelId = id;
  },
  getViewingChannelId(): string | null {
    return viewingChannelId;
  },
};
