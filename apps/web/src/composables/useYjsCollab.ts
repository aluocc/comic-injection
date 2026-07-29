import { ref } from 'vue';
import * as Y from 'yjs';
import { io } from 'socket.io-client';

function decodeBase64(b64: string): Uint8Array {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

function encodeBase64(u: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < u.length; i++) bin += String.fromCharCode(u[i]);
  return btoa(bin);
}

export function useYjsCollab(workflowId: string, token: string) {
  const doc = new Y.Doc();
  const yNodes = doc.getMap<string>('nodes');
  const yEdges = doc.getMap<string>('edges');
  const connected = ref(false);

  const socket = io('/collab', { query: { workflowId }, auth: { token } });

  socket.on('connect', () => { connected.value = true; });
  socket.on('disconnect', () => { connected.value = false; });

  socket.on('yjs:init', (b64: string) => {
    Y.applyUpdate(doc, decodeBase64(b64), 'remote');
  });

  socket.on('yjs:update', ({ update }: { update: string }) => {
    Y.applyUpdate(doc, decodeBase64(update), 'remote');
  });

  doc.on('update', (u: Uint8Array, origin: unknown) => {
    if (origin === 'remote') return;
    socket.emit('yjs:update', { update: encodeBase64(u) });
  });

  function persist() { socket.emit('yjs:persist'); }
  function dispose() { socket.disconnect(); doc.destroy(); }

  return { doc, yNodes, yEdges, connected, persist, dispose };
}
