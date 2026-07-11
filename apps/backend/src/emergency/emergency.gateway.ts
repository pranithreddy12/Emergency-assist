import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

/**
 * Live incident channel. Clients (the reporter's device, responders, hospital
 * dashboards) join an incident room and receive status/location/report events.
 */
@WebSocketGateway({ namespace: '/emergency', cors: { origin: true } })
export class EmergencyGateway {
  private readonly logger = new Logger(EmergencyGateway.name);

  @WebSocketServer()
  server!: Server;

  @SubscribeMessage('incident:join')
  join(@MessageBody() data: { incidentId: string }, @ConnectedSocket() client: Socket) {
    const room = this.room(data.incidentId);
    client.join(room);
    this.logger.debug(`${client.id} joined ${room}`);
    return { joined: data.incidentId };
  }

  @SubscribeMessage('incident:leave')
  leave(@MessageBody() data: { incidentId: string }, @ConnectedSocket() client: Socket) {
    client.leave(this.room(data.incidentId));
    return { left: data.incidentId };
  }

  /** Broadcast an event to everyone watching an incident. */
  emitIncidentEvent(incidentId: string, event: string, payload: unknown) {
    this.server?.to(this.room(incidentId)).emit(event, payload);
  }

  private room(incidentId: string) {
    return `incident:${incidentId}`;
  }
}
