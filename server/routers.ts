import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { demoCase, startReview, submitRebuttal } from "./committee";
import { reevaluateInputSchema, startReviewInputSchema } from "../shared/rejectMeFirst";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  committee: router({
    demo: publicProcedure.query(async () => {
      const firstRound = await startReview(demoCase.input);
      const secondRound = await submitRebuttal({
        language: firstRound.language,
        direction: firstRound.direction,
        mode: firstRound.mode,
        projectBrief: firstRound.projectBrief,
        reviews: firstRound.reviews,
        rebuttal: demoCase.rebuttal,
      });

      return {
        title: demoCase.title,
        input: demoCase.input,
        rebuttal: demoCase.rebuttal,
        first_round: firstRound,
        second_round: secondRound,
      };
    }),
    startReview: publicProcedure.input(startReviewInputSchema).mutation(async ({ input }) => {
      try {
        return await startReview(input);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to start review",
        });
      }
    }),
    submitRebuttal: publicProcedure.input(reevaluateInputSchema).mutation(async ({ input }) => {
      try {
        return await submitRebuttal(input);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to submit rebuttal",
        });
      }
    }),
  }),
});

export type AppRouter = typeof appRouter;
