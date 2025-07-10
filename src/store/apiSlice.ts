import { ModuleData } from '@/types/plannerTypes';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  endpoints: (builder) => ({
    getModuleByCode: builder.query<ModuleData, string>({
      query: (code) => `/modules/${encodeURIComponent(code)}`,
    }),
  }),
});

export const { useGetModuleByCodeQuery } = apiSlice;