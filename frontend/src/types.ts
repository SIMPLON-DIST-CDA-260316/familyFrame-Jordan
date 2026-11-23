// Photo telle que renvoyée par l'API (GET /api/photos) et l'événement Socket.IO photo:new.
export type Photo = {
  id: string
  url: string
  publicId: string
  pseudo: string
  createdAt: string // date ISO 8601
}
