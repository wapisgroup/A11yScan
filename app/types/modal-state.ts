/**
 * ModalState
 * ----------
 * Discriminated union describing the D state.
 *
 * - open: false
 *   Modal is closed.
 *
 * - open: true, mode: "create"
 *   Modal is open in creation mode.
 *
 * - open: true, mode: "edit"
 *   Modal is open in edit mode for an existing d.
 */
type ModalState<D> =
    | { open: false }
    | { open: true; mode: "create"; initial: null }
    | { open: true; mode: "edit"; initial: D };