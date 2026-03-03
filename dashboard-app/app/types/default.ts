export type TimestampLike =
  | Date
  | string
  | number
  | null
  | undefined
  | {
      toDate?: () => Date;
      seconds?: number;
    };
