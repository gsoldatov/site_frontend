import React, { useMemo } from "react";
import { Confirm } from "semantic-ui-react";


/**
 * /objects/edited page confirm dialog component.
 */
export const ObjectsEditedConfirm = ({ confirmState, setConfirmState }) => {
    const handleConfirm = useMemo(() => () => {
        if (confirmState.onConfirm) confirmState.onConfirm();
        setConfirmState({ ...confirmState, open: false });
    }, [confirmState]);
    const handleCancel = useMemo(() => () => {
        if (confirmState.onCancel) confirmState.onCancel();
        setConfirmState({ ...confirmState, open: false });
    }, [confirmState]);

    const { open, content } = confirmState;

    return (
        <Confirm open={open} content={content} onConfirm={handleConfirm} onCancel={handleCancel} />
    );
};
