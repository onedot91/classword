import type { Initial, StudentNumber } from './app';

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      rounds: {
        Row: {
          id: string;
          round_date: string;
          topic: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          round_date: string;
          topic?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          round_date?: string;
          topic?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      entries: {
        Row: {
          id: string;
          round_date: string;
          initial: Initial;
          word: string;
          student_number: StudentNumber;
          is_mvp: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          round_date: string;
          initial: Initial;
          word: string;
          student_number: StudentNumber;
          is_mvp?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          round_date?: string;
          initial?: Initial;
          word?: string;
          student_number?: StudentNumber;
          is_mvp?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'entries_round_date_fkey';
            columns: ['round_date'];
            isOneToOne: false;
            referencedRelation: 'rounds';
            referencedColumns: ['round_date'];
          },
        ];
      };
      teacher_sessions: {
        Row: {
          token: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          token?: string;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          token?: string;
          expires_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      word_quizzes: {
        Row: {
          round_date: string;
          initial: Initial;
          answer: string;
          meaning: string;
          example_sentence: string;
          updated_at: string;
        };
        Insert: {
          round_date: string;
          initial: Initial;
          answer: string;
          meaning: string;
          example_sentence: string;
          updated_at?: string;
        };
        Update: {
          round_date?: string;
          initial?: Initial;
          answer?: string;
          meaning?: string;
          example_sentence?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'word_quizzes_round_date_fkey';
            columns: ['round_date'];
            isOneToOne: true;
            referencedRelation: 'rounds';
            referencedColumns: ['round_date'];
          },
        ];
      };
      word_quiz_solvers: {
        Row: {
          round_date: string;
          student_number: StudentNumber;
          solved_at: string;
        };
        Insert: {
          round_date: string;
          student_number: StudentNumber;
          solved_at?: string;
        };
        Update: {
          round_date?: string;
          student_number?: StudentNumber;
          solved_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'word_quiz_solvers_round_date_fkey';
            columns: ['round_date'];
            isOneToOne: false;
            referencedRelation: 'rounds';
            referencedColumns: ['round_date'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
