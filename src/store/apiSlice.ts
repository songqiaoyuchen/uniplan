// we keep ModuleData dynamic for now in case for DB updates
// in the future this should really be static and maintained per semester / acamdeic year
import { ModuleData } from '@/types/plannerTypes';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  endpoints: (builder) => ({
    getModuleByCode: builder.query<ModuleData, string>({
      query: (code) => `/modules/${encodeURIComponent(code)}`,
    }),

    getTimetable: builder.query<{ modules: { code: string; status: string }[]; semesters: { id: number; moduleCodes: string[] }[] }, void> ({
      query: () => `/timetable`,
    }),
  }),
});

export const { useGetModuleByCodeQuery, useGetTimetableQuery, useLazyGetTimetableQuery  } = apiSlice;