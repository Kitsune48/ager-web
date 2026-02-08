"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/auth/session";
import { getMe, patchMe, changeMyPassword, deleteMe } from "@/lib/api/me";
import type { UpdateMyProfileRequest, ChangeMyPasswordRequest } from "@/lib/api/me.types";

export function useMeQuery() {
  const { accessToken } = useSession();
  return useQuery({
    queryKey: ["me"],
    queryFn: () => getMe(accessToken!),
    enabled: !!accessToken
  });
}

export function useUpdateMe() {
  const { accessToken } = useSession();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateMyProfileRequest) => patchMe(body, accessToken!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] });
    }
  });
}

export function useChangePassword() {
  const { accessToken } = useSession();
  return useMutation({
    mutationFn: (body: ChangeMyPasswordRequest) => changeMyPassword(body, accessToken!)
  });
}

export function useDeleteMe() {
  const { accessToken } = useSession();
  return useMutation({
    mutationFn: () => deleteMe(accessToken!)
  });
}
