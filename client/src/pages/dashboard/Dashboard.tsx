import 'allotment/dist/style.css';

import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { Allotment } from 'allotment';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useEventListener } from 'usehooks-ts';

import Header from '../../components/header';
import RequestPanel from '../../components/requestPanel';
import ResponsePanel from '../../components/responsePanel';
import Sidebar from '../../components/sidebar';
import { CurrentRequestContext, UserContext } from '../../context';
import { CollectionsContext } from '../../context/CollectionsContext';
import CurrentRequest from '../../model/CurrentRequest';
import Request from '../../model/Request';
import { errorToast, parseResponseEvent } from '../../utils';
import styles from './Dashboard.module.css';

function Dashboard() {
  const { setCollections, writeRequestToCollections } = useContext(CollectionsContext);
  const { currentRequest, setCurrentRequest, saveRequest } =
    useContext(CurrentRequestContext);
  const { user } = useContext(UserContext);
  const [_isExtInitialized, _setIsExtInitialized] = useState<boolean>(false);
  const isExtInitialized = useRef(_isExtInitialized);
  const setIsExtInitialized = (result: boolean) => {
    _setIsExtInitialized(result);
    isExtInitialized.current = result;
  };
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const getCollections = useCallback(async () => {
    try {
      const response = await fetch('/api/collection');
      const collections = await response.json();
      setCollections(collections);
    } catch (e) {
      errorToast('Could not retrieve collections', toast);
    }
  }, [toast, setCollections]);

  useEffect(() => {
    if (isExtInitialized.current) return;
    const periodic = setInterval(() => {
      console.log('Checking extension');
      if (isExtInitialized.current) {
        clearInterval(periodic);
      } else {
        window.postMessage({ type: 'ping' }, '*');
      }
    }, 2000);
    getCollections();
  }, [getCollections]);

  const handlePongMessage = (event: MessageEvent<any>) => {
    if (event.data.type === 'pong') {
      console.log('Extension connected');
      setIsExtInitialized(true);
      onClose();
    }
  };

  const handleResponseMessage = async (event: MessageEvent<any>) => {
    if (event.data.type === 'receive-response') {
      if (event.data.response.err) {
        setCurrentRequest((request: CurrentRequest) => ({
          ...request,
          isLoading: false,
        }));
        errorToast(event.data.response.err, toast);
        return;
      }

      const response = parseResponseEvent(event);

      const newRequest = {
        ...currentRequest,
        data: {
          ...currentRequest.data,
          response: response,
        },
        isLoading: false,
      };

      if (currentRequest.id !== -1 && user?.data.settings.saveOnSend) {
        const response = await fetch('/api/request', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newRequest),
        });
        if (response.status !== 200) throw new Error();
        const savedRequest = { ...newRequest, changed: false };
        writeRequestToCollections(savedRequest);
        setCurrentRequest(savedRequest);
      } else {
        setCurrentRequest(newRequest);
      }
    }
  };

  useEventListener('message', handlePongMessage);
  useEventListener('message', handleResponseMessage);

  return (
    <div className={styles.parent}>
      <header>
        <Header />
      </header>
      <div className={styles.allotment}>
        <Allotment defaultSizes={[50, 200]} snap>
          <div className={styles.sidebar}>
            <Sidebar />
          </div>
          <div className={styles.main}>
            <Allotment vertical defaultSizes={[200, 100]} snap>
              <div className={styles.requestPanel}>
                <RequestPanel isExtInitialized={isExtInitialized} openExtModal={onOpen} />
              </div>
              <div className={styles.responsePanel}>
                <ResponsePanel />
              </div>
            </Allotment>
          </div>
        </Allotment>
      </div>
      <Modal isOpen={isOpen} onClose={() => {}}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Failed to connect to extension</ModalHeader>
          <ModalBody>
            The extension could not be connected. Please install the extension and copy
            the URL of this window into the host field of the extension. Then click retry.
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="green"
              onClick={() => window.postMessage({ type: 'ping' }, '*')}
            >
              Retry
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

export default Dashboard;
