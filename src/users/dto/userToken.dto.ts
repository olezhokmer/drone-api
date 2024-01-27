export class UserTokenDto {
  constructor(id: string) {
    this.id = id;
    this.date = new Date().toISOString();
  }
  id: string;
  date: string;
}
