import { z } from 'zod';

export const createRoomSchema = z.object({
  displayName: z.string().min(1).max(32),
});

export const joinRoomSchema = z.object({
  roomCode: z.string().min(4).max(8),
  displayName: z.string().min(1).max(32),
  playerId: z.string().optional(),
});

export const choosePirateSchema = z.object({
  pirateId: z.string().min(1).max(64),
});

export const chooseScenarioSchema = z.object({
  scenarioId: z.string().min(1).max(64),
});

export const exchangeCardSchema = z.object({
  cardId: z.string().min(1).max(64),
});

export const playCardSchema = z.object({
  cardId: z.string().min(1).max(64),
  chooseStraight: z.boolean().optional(),
  ignoreKrakenDamage: z.boolean().optional(),
});

export const reconnectSchema = z.object({
  roomCode: z.string().min(4).max(8),
  playerId: z.string().min(1),
});
