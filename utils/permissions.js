module.exports = function hasAdminAccess(member) {
  if (!member) return false;

  return (
    member.permissions.has("Administrator") ||
    member.permissions.has("ManageGuild")
  );
};
