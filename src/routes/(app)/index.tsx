import { onMount } from "solid-js";
import { useNavigate } from "@solidjs/router";

const DEFAULT_POOL_ID =
  "0xf948981b806057580f91622417534f491da5f61aeaf33d0ed8e69fd5691c95ce";

export default function Home() {
  const navigate = useNavigate();

  onMount(() => {
    navigate(`/trade/${DEFAULT_POOL_ID}`, { replace: true });
  });

  return (
    <div class="flex h-full items-center justify-center">
      <p class="text-muted-foreground">Redirecting...</p>
    </div>
  );
}
