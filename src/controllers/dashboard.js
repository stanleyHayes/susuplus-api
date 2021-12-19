const Contribution = require("../models/contribution");
const Disbursement = require("../models/disbursement");
const GroupMember = require("../models/group-member");
const SusuMember = require("../models/susu-member");
const moment = require("moment");
const Invitation = require("../models/invitation");

exports.getDashboard = async (req, res) => {
    try {
        const totalContributions = await Contribution.find({contributor: req.user._id}).countDocuments();
        const totalDisbursements = await Disbursement.find({recipient: req.user._id}).countDocuments();

        const latestContributions = await Contribution
            .find({contributor: req.user._id})
            .limit(5)
            .sort({createdAt: -1});

        const latestDisbursements = await Disbursement
            .find({recipient: req.user._id})
            .limit(5)
            .sort({createdAt: -1});

        const acceptedInvitations = await Invitation.find({invitee: req.user._id, status: 'ACCEPTED'}).countDocuments();
        const rejectedInvitations = await Invitation.find({invitee: req.user._id, status: 'REJECTED'}).countDocuments();
        const expiredInvitations = await Invitation.find({invitee: req.user._id, status: 'EXPIRED'}).countDocuments();
        const totalInvitations = await Invitation.find({invitee: req.user._id}).countDocuments();

        const acceptancePercentage = totalInvitations === 0 ? 0 : (acceptedInvitations / totalInvitations * 100);
        const rejectedPercentage = totalInvitations === 0 ? 0 : (rejectedInvitations / totalInvitations * 100);
        const expiredPercentage = totalInvitations === 0 ? 0 : (expiredInvitations / totalInvitations * 100);

        const totalUserGroups = await GroupMember.find({user: req.user._id}).countDocuments();
        const totalUserSusu = await SusuMember.find({user: req.user._id}).countDocuments();

        const allUserContributions = await Contribution.find({contributor: req.user._id}).sort({createdAt: -1});
        const allUserDisbursements = await Disbursement.find({recipient: req.user._id}).sort({createdAt: -1});

        const lastWeek = moment("YYYY-MM-DD").subtract(1, 'week');
        const lastMonth = moment("YYYY-MM-DD").subtract(1, 'month');
        const lastYear = moment("YYYY-MM-DD").subtract(1, 'year');

        const lastWeekContributions = [];
        let lastWeekContributionsCount = 0;
        let lastWeekContributionAmount = 0;

        let lastMonthContributionsCount = 0;
        const lastMonthContributions = [];
        let lastMonthContributionAmount = 0;

        const lastYearContributions = [];
        let lastYearContributionsCount = 0;
        let lastYearContributionAmount = 0;

        let contributionCurrency = null;

        for (let i = 0; i < allUserContributions.length; i++) {
            const contribution = allUserContributions[i];

            if (!contributionCurrency)
                contributionCurrency = contribution.amount.currency;

            if (lastWeek.isSameOrAfter(contribution.createdAt)) {
                lastWeekContributions.push(contribution);
                lastWeekContributionsCount++;
                lastWeekContributionAmount += contribution.amount.value;
            }

            if (lastMonth.isSameOrAfter(contribution.createdAt)) {
                lastMonthContributions.push(contribution);
                lastMonthContributionsCount++;
                lastMonthContributionAmount += contribution.amount.value;
            }

            if (lastYear.isSameOrAfter(contribution.createdAt)) {
                lastYearContributions.push(contribution);
                lastYearContributionsCount++;
                lastYearContributionAmount += contribution.amount.value;
            }
        }


        const lastWeekDisbursements = [];
        let lastWeekDisbursementsCount = 0;
        let lastWeekDisbursementAmount = 0;

        let lastMonthDisbursementsCount = 0;
        const lastMonthDisbursements = [];
        let lastMonthDisbursementAmount = 0;

        const lastYearDisbursements = [];
        let lastYearDisbursementsCount = 0;
        let lastYearDisbursementAmount = 0;

        let disbursementCurrency = null;

        for (let i = 0; i < allUserContributions.length; i++) {
            const disbursement = allUserDisbursements[i];
            if (!disbursementCurrency)
                disbursementCurrency = disbursement.amount.currency;

            if (lastWeek.isSameOrAfter(disbursement.createdAt)) {
                lastWeekDisbursements.push(disbursement);
                lastWeekDisbursementsCount++;
                lastWeekDisbursementAmount += disbursement.amount.value;
            }

            if (lastMonth.isSameOrAfter(disbursement.createdAt)) {
                lastMonthDisbursements.push(disbursement);
                lastMonthDisbursementsCount++;
                lastMonthDisbursementAmount += disbursement.amount.value;
            }

            if (lastYear.isSameOrAfter(disbursement.createdAt)) {
                lastYearDisbursements.push(disbursement);
                lastYearDisbursementsCount++;
                lastYearDisbursementAmount += disbursement.amount.value;
            }
        }

        res.status(200).json({
            data: {
                totalContributions,
                totalDisbursements,
                latestContributions,
                latestDisbursements,
                totalInvitations,
                acceptedInvitations: {
                    acceptedInvitationsCount: acceptedInvitations,
                    percentage: acceptancePercentage,
                },
                rejectedInvitations: {
                    rejectedInvitationsCount: rejectedInvitations,
                    percentage: rejectedPercentage,
                },
                expiredInvitations: {
                    expiredInvitationsCount: expiredInvitations,
                    percentage: expiredPercentage,
                },
                totalUserGroups,
                totalUserSusu,
                contributions: {
                    contributionCurrency,
                    week: {
                        lastWeekContributions,
                        lastWeekContributionsCount,
                        lastWeekContributionAmount
                    },
                    month: {
                        lastMonthContributionsCount,
                        lastMonthContributions,
                        lastMonthContributionAmount
                    },
                    year: {
                        lastYearContributions,
                        lastYearContributionsCount,
                        lastYearContributionAmount
                    }
                },
                disbursements: {
                    disbursementCurrency,
                    week: {
                        lastWeekDisbursements,
                        lastWeekDisbursementsCount,
                        lastWeekDisbursementAmount
                    },
                    month: {
                        lastMonthDisbursementsCount,
                        lastMonthDisbursements,
                        lastMonthDisbursementAmount
                    },
                    year: {
                        lastYearDisbursements,
                        lastYearDisbursementsCount,
                        lastYearDisbursementAmount
                    }
                }
            }
        });
    } catch (e) {
        res.status(500).json({message: e.message});
    }
}
