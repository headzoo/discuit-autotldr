import { EventDispatcher } from 'EventDispatcher';

const eventTypes = ['rewatch'];
export const eventDispatcher = new EventDispatcher({ validEventTypes: eventTypes });
