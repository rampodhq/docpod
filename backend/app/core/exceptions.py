class AuthError(Exception):
    """Raised when authentication fails."""
    pass


class WorkspaceAccessError(Exception):
    """Raised when workspace access is denied."""
    pass