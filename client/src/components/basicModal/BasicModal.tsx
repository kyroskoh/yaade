import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/react';
import { MutableRefObject, useRef } from 'react';
import { FormEvent, FunctionComponent } from 'react';

type BasicModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialRef?: MutableRefObject<null>;
  heading: string;
  isButtonDisabled: boolean;
  onClick: () => void;
  buttonText: string;
  buttonColor: string;
  secondaryButtonText?: string;
  onSecondaryButtonClick?: () => void;
};

const BasicModal: FunctionComponent<BasicModalProps> = ({
  isOpen,
  onClose,
  initialRef,
  heading,
  onClick,
  isButtonDisabled,
  buttonText,
  buttonColor,
  children,
  secondaryButtonText,
  onSecondaryButtonClick,
}) => {
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isButtonDisabled) return;
    onClick();
  }

  const secondaryBtnText = secondaryButtonText ?? 'Close';
  const onSecondaryBtnClick = onSecondaryButtonClick ?? onClose;

  const defaultRef = useRef(null);
  return (
    <Modal isOpen={isOpen} onClose={onClose} initialFocusRef={initialRef || defaultRef}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{heading}</ModalHeader>
        <ModalCloseButton />
        <form onSubmit={handleSubmit}>
          <ModalBody>{children}</ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onSecondaryBtnClick}>
              {secondaryBtnText}
            </Button>
            <Button
              colorScheme={buttonColor}
              disabled={isButtonDisabled}
              type="submit"
              ref={defaultRef}
            >
              {buttonText}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default BasicModal;
